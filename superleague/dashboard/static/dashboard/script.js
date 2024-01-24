let arrows = document.querySelectorAll(".calendarArrow")
let currentWeek = document.querySelector(".weekNav > div > h2:nth-child(2)")
let teamOneElements = document.querySelectorAll('.teamOne');
let teamTwoElements = document.querySelectorAll('.teamTwo');


arrows[0].addEventListener('click', () => {
    if(currentWeek.textContent != "1") {
    fetch(`/calendar?matchday=${Number(currentWeek.textContent) - 1}`)
    .then(response => response.json())
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            teamOneElements[i].textContent = data[i].team_one;
            teamTwoElements[i].textContent = data[i].team_two;
        }
        currentWeek.textContent--
    })
}})

arrows[1].addEventListener('click', () => {
    if(currentWeek.textContent != "7") {
    fetch(`/calendar?matchday=${Number(currentWeek.textContent) +1}`)
    .then(response => response.json())
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            teamOneElements[i].textContent = data[i].team_one;
            teamTwoElements[i].textContent = data[i].team_two;
        }
        currentWeek.textContent++
    })
}})
    
