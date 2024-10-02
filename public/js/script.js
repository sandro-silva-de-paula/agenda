const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const daysWeek = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sab."];

let FORM_OPEN = false;
let DATABASE = {};
let CURRENT_SUNDAY;

// Runs when the page loads
window.onload = () => {
  // document.getElementById("myForm").submit();
  setWeek("today");

  const previousButtonNode = document.getElementById("previous-week-btn");
  const thisWeekButtonNode = document.getElementById("this-week-btn");
  const nextButtonNode = document.getElementById("next-week-btn");
  const dayNodes = document.querySelectorAll(".day");

  previousButtonNode.onclick = () => {
    setWeek("previous");
  };

  thisWeekButtonNode.onclick = () => {
    setWeek("today");
  };

  nextButtonNode.onclick = () => {
    setWeek("next");
  };

  for (let i = 0; i < dayNodes.length; i++) {
    dayNodes[i].onclick = createForm;
    dayNodes[i].onmouseenter = showDay;
  }
};

function setWeek(nav) {
  switch (nav) {
    case "previous":
      CURRENT_SUNDAY = getPreviousSunday();
      break;
    case "today":
      CURRENT_SUNDAY = getSunday();
      break;
    case "next":
      CURRENT_SUNDAY = getNextSunday();
      break;
  }
  
  
  renderMonth();
  renderDaysOfWeek();
  
  //// carregar dados aqui de acordo com a semana
    loadDadosJson(CURRENT_SUNDAY).then((agenda) => {
    // console.log(agenda)
    DATABASE = mapAgenda(agenda);
    renderCalendar();
  });

}

function getSunday() {
  const today = new Date();
  const offset = today.getDay();
  const sunday = new Date();

  sunday.setDate(today.getDate() - offset);

  return sunday;
}

function getNextSunday() {
  const nextSunday = new Date(CURRENT_SUNDAY);
  nextSunday.setDate(nextSunday.getDate() + 7);
  return nextSunday;
}

function getPreviousSunday() {
  const previousSunday = new Date(CURRENT_SUNDAY);
  previousSunday.setDate(previousSunday.getDate() - 7);
  return previousSunday;
}

function renderMonth() {
  // Get the node
  const monthNode = document.getElementById("month");

  // Get Month for sunday
  const sundayMonth = months[CURRENT_SUNDAY.getMonth()];

  // Get Month for saturday
  const saturday = new Date(CURRENT_SUNDAY);
  saturday.setDate(CURRENT_SUNDAY.getDate() + 6);
  const saturdayMonth = months[saturday.getMonth()];

  // Compare the two
  // If they are the same, show month
  if (saturdayMonth === sundayMonth) {
    monthString = `${sundayMonth} de ${CURRENT_SUNDAY.getFullYear()}`;

    // If they are not, concat and show both
  } else {
    monthString = `${sundayMonth}\n\n${saturdayMonth}`;
  }

  monthNode.innerText = monthString;
}

function renderDaysOfWeek() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = new Date(CURRENT_SUNDAY);
  currentDay.setHours(0, 0, 0, 0);

  let dayString;
  for (let i = 0; i <= 6; i++) {
    dayNode = document.getElementById(`day-${i + 1}`);
    dayString = `${daysWeek[i]} \n ${currentDay.getDate()}`;

    dayNode.innerText = dayString;

    if (currentDay.getTime() == today.getTime()) {
      dayNode.classList.add("today");
    } else {
      dayNode.classList.remove("today");
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }
}

function renderDay(dayNode, appt) {
  ////////////////
  ///// nao carrega quando um camppo esta vazio
  /// mas o erro foi ter deixado salvar  compo vazio se esta not null
  ///""""???????????????????????""""""""""
  //////////////////
  if (
    appt?.first_name?.length ||
    appt?.obs_?.length ||
    appt?.service?.length||
    appt?.phone?.length 

  ) {
    dayNode.innerText = `${appt.first_name} \n ${appt.phone} \n ${appt.service} \n ${appt.obs_}`;
  } else {
    dayNode.innerText = "";
  }
}

function renderCalendar() {
  // Pegar os Nodes ".day" e iterar um por um
  const dayNodes = document.querySelectorAll(".day");
  // Para cada Node
  // console.log(DATABASE) 
  for (const dayNode of dayNodes) {
    // Calcula o timestamp
    offsets = dayNode.id.split("-d");
    timestamp = getTimestamp(offsets);
     renderDay(dayNode, DATABASE[timestamp]);


  }
}

function showDay(event) {
  let currentDayNod = event.target;
  let day = currentDayNod.id.substring(currentDayNod.id.length - 1);
  let dayHeaderNode = document.getElementById(`day-${day}`);
  currentDayNod.title = dayHeaderNode.innerText;
}

function createForm(event) {
  if (FORM_OPEN) {
    FORM_OPEN = false;
    const formNode = document.getElementById("appt-form");
    if (formNode) {
      formNode.parentElement.removeChild(formNode);
    }
  } else {
    const dayNode = event.target;
    //// testar se timestamp ja marcado , pra abrir form////
    if (dayNode.innerText.length ===0){
        FORM_OPEN = true;
        dayNode.innerHTML = `<form id="appt-form" nome="appt_form" onSubmit="return validaDados();" >
                                    <input type="text" id="pname"  placeholder="Nome"  name="pname"> 
                                    <br>
                                    <input type="text" id="phone" placeholder="Telefone">
                                    <br>
                                    <input type="text" id="procedimento" placeholder="Procedimento" >
                                    <br>
                                    <input type="text" id="obs" placeholder="Obs...">
                                    <br>
                                    <input id="appt-form-submit" type="submit" value="submit">
                                </form>`;
        document.getElementById("appt-form-submit").onclick = saveSchedule;
        document.getElementById("pname").onclick = (event) => {
          event.stopPropagation();
        };
        document.getElementById("phone").onclick = (event) => {
          event.stopPropagation();
        };
        document.getElementById("obs").onclick = (event) => {
          event.stopPropagation();
        };
        document.getElementById("procedimento").onclick = (event) => {
          event.stopPropagation();
        };
  }
  }
}

function saveSchedule(event) {
  event.stopPropagation();
  event.preventDefault();

  submitNode = event.target;
  dayNode = submitNode.parentElement.parentElement;
  offsets = dayNode.id.split("-d");
  appt = {
    firstName: document.getElementById("pname").value,
    phone: document.getElementById("phone").value,
    obs: document.getElementById("obs").value,
    procedure: document.getElementById("procedimento").value,
  };
  
  timestamp = getTimestamp(offsets);
  
  
  saveDadosJson(timestamp, appt).then((returned_database) => {
    DATABASE[timestamp] = returned_database;
    renderCalendar();
  });
  return false;
}

function getTimestamp(offsets) {
  // ACHAR O TIMESTAMP EM FORMATO STRING
  
  const sunday = new Date(CURRENT_SUNDAY);
  // Andou os dias
  sunday.setDate(sunday.getDate() + parseInt(offsets[1]) - 1);

  // Adicionar as horas
  sunday.setHours(parseInt(offsets[0]), offsets[0].slice(3) | 0, 0, 0);
  // Convert to string and return
  return sunday.toISOString();
}

async function loadDadosJson(currentSunday) {

  const dateIni = new Date(currentSunday);
  dateIni.setHours(0, 0, 0, 0);

  const dateEnd = new Date(dateIni);
  dateEnd.setDate(dateEnd.getDate() + 6);
  dateEnd.setHours(23, 59, 0, 0);

  const  start =dateIni.toISOString();
  const end = dateEnd.toISOString()


  const response = await fetch(`https://localhost:8443/agenda?start=${start}&end=${end}`,{
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  });
  
  const restored_database = await response.json();
  return restored_database;
}

async function saveDadosJson(timestamp, appt) {

  //enviando request POST pro server
  try {
  const response = await fetch("https://localhost:8443/agenda", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ timestamp, first_name: appt.firstName, obs_: appt.obs, service:appt.procedure, phone:appt.phone }),
  });

  const returned_database = await response.json();
  return returned_database;

} catch(e){
    // console.log(e);
    /// parece que esse console nao imprimi//////

   }
};


function mapAgenda(agenda){
  const reducer = (agendaMap,appt) => {
    agendaMap[appt.appointment_time] = appt;
    return agendaMap;
  }

   return agenda.reduce(reducer,{});
};


