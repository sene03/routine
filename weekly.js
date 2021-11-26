const week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
let today;
let records = {};
let archive = [], list = [];

// Make string out of date using local time zone
Date.prototype.string = function () {
    let yyyy = this.getFullYear();
    let mm = this.getMonth() + 1;
    let dd = this.getDate();
    
    return [yyyy, ("0" + mm).slice(-2), ("0" + dd).slice(-2)].join("-");
}
const actualToday = new Date().string();

// Date of today
function parseURL()
{
    let url = document.location.href;
    let todays = url.split('?date=')[1];
    if (!todays) {
        today = new Date();
        todays = [today.getFullYear(), today.getMonth()+1, today.getDate()];
    }
    else {
        todays = todays.split('-');
        today = new Date(todays[0], todays[1]-1, todays[2]);
    }

    document.querySelector(".today").textContent =
        todays[0] + " " + todays[1] + " " + week[today.getDay()];
}

// Accomplishment status
const Status = {
    Miss: 0,
    Done: 1
};

// Load data when window is loaded
function loadHabits(date, dayValue)
{
    let data = localStorage.getItem(date);
    if (data) records[date] = JSON.parse(data);
    else {
        records[date] = [];
        archive.forEach(habit => {
            if (habit.days[dayValue] && habit.created <= date && habit.deleted > date) {
                let definedHabit = {
                    name: habit.name,
                    stat: Status.Miss
                };
                records[date].push(definedHabit);
            }
        });
    }
}

// Save habits to local storage
function saveHabits(date) {
    localStorage.setItem(date, JSON.stringify(records[date]));
}

function addToStorage(habit) {
    archive.push(habit);
    localStorage.setItem("habits", JSON.stringify(archive));

    let date = new Date(today);
    let dateValue = today.getDate();
    for (let i = 0; i < 7 - today.getDay(); i++) {
        date.setDate(dateValue++);
        let string = date.string();
        
        let definedHabit = {
            name: habit.name,
            stat: Status.Miss
        };
        records[string].push(definedHabit);
        
        saveHabits(string);
    }
    console.log(records);
}

// Create habit element and append to .contents
function addHabit(habit) {
    // Create .habit-group
    let div = document.createElement("div");
    div.className = "habit-group";

    // .habit
    let divHabit = document.createElement("div");
    divHabit.className = "habit";

    let [ text, color ] = habit.category.split("=");
    let category = document.createElement("span");
    category.innerText = text + " | " + habit.name;
    let categoryColor = document.createElement("span");
    categoryColor.innerText="■ ";
    categoryColor.style.color = color;

    divHabit.appendChild(categoryColor);
    divHabit.appendChild(category);
    div.appendChild(divHabit);

    // .weekly-accomplishment
    let divWeek = document.createElement("div");
    divWeek.className = "weekly-accomplishment";

    // delete button
    let deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger";
    deleteButton.id = "delete-button";
    
    if (today.string() !== actualToday) deleteButton.classList.add("disabled");
    deleteButton.addEventListener("click", () => {
        div.remove();

        let name = div.firstChild.textContent;
        for (let i = 0; i < archive.length(); i++) {
            if (habit.name === name) {
                if (habit.created === actualToday) archive.splice(i, 1);
                else habit.deleted = actualToday;
                
                break;
            }
        }
        let date = new Date(today);
        let dateValue = today.getDate();
        for (let i = 0; i < 7 - today.getDay(); i++) {
            date.setDate(dateValue++);
            let string = date.string();

            let array = records[string];
            for (let k = 0; k < array.length; k++) {
                let record = array[k];
                if (record.name === name) {
                    array.splice(k, 1); break;
                }
            }
            saveHabits(string);
        }
    });

    // Make button visible when hovered
    let span = document.createElement("span");
    span.appendChild(deleteButton);
    divWeek.appendChild(span);
    //divWeek.appendChild(deleteButton);

    
    // .checkbox
    for (let day = 0; day < 7; day++) {
        let checkbox = document.createElement("div");
        
        // add 0~6 to distinguish days
        checkbox.className = "checkbox " + day;
        
        // status of the day (done or failed)
        let array = (list[day] > actualToday) ? [] : records[list[day]];
        let record, DNE = true;
        for (let i = 0; i < array.length; i++) {
            record = array[i];
            if (record.name === habit.name) {
                if (record.stat === Status.Done) {
                    checkbox.classList.add("done");
                }
                else if (record.stat === Status.Miss && list[day] < actualToday) {
                    checkbox.classList.add("failed");
                }
                DNE = false; break;
            }
        } if (DNE) checkbox.classList.add("disabled");
        
        // Add eventlistener
        // Click to change status : Miss->done->failed
        checkbox.addEventListener("click", () => {
            if (checkbox.classList.contains("done")) {
                checkbox.classList.replace("done", "failed");
                record.stat = Status.Miss;
            } else if (checkbox.classList.contains("failed")) {
                checkbox.classList.remove("failed");
            } else {
                checkbox.classList.add("done");
                record.stat = Status.Done;
            }

            // Save status
            saveHabits(list[day]);
        });

        divWeek.appendChild(checkbox); // Append to weekly-accomplishment class
    }
    div.appendChild(divWeek);

    // Append to .contents
    let contents = document.querySelector(".contents");
    contents.appendChild(div);
}

function buildWeek()
{
    let data = localStorage.getItem("habits");
    if (data) archive = JSON.parse(data);

    let dateValue = today.getDate() - today.getDay();
    for (let i = 0; i < 7; i++) {
        date = new Date(today);
        date.setDate(dateValue++);
        list.push(date.string());
        
        loadHabits(date.string(), i);
    }
    archive.filter(habit => (habit.days[today.getDay()] && habit.created <= today.string() && habit.deleted > today.string()))
        .forEach(addHabit);
}

window.addEventListener("load", () => {
    parseURL();
    buildWeek();

    // Add eventlistener to Add button
    let addButton = document.querySelector(".button.add");
    let inputArea = document.querySelector(".inputArea");

    if (today.string() !== actualToday) addButton.classList.add("disabled");
    addButton.addEventListener("click", () => {
        inputArea.hidden ? inputArea.hidden = false : inputArea.hidden = true;
    });
});

// Add eventlistener to Submit button
let submitButton = document.querySelector("#submit");
submitButton.addEventListener("click", () => {
    let textInput = document.getElementById("nameText").value;
    let categoryInput = document.getElementById("categoryText").value;
    let categoryInputColor = document.getElementById("categoryColor").value;
    if (textInput === "" || categoryInput === "") return;

    // Create new habit object
    let newHabit = {
        name: textInput,
        days: [0, 0, 0, 0, 0, 0, 0],
        created: actualToday,
        deleted: "3",
        category: categoryInput + "=" + categoryInputColor
    };
    let selectDays = document.querySelectorAll(".day-select");
    for (let i = 0; i < 7; i++) {
        if (selectDays[i].classList.contains("selected")) newHabit.days[i] = 1;
    }
    
    // Clear inputs
    document.getElementById("nameText").value = "";
    document.getElementById("categoryText").value = "";
    document.querySelector(".inputArea").hidden = true;
    selectDays.forEach(e => e.classList.remove("selected"));

    addToStorage(newHabit);
    addHabit(newHabit);
});

document.querySelectorAll(".day-select").forEach((e) => {
    e.addEventListener("click", () => {
        if (e.classList.contains("selected")) e.classList.remove("selected");
        else e.classList.add("selected");
    });
});