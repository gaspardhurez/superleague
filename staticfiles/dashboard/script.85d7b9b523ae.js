const MAX_WEEK = 5
const MIN_WEEK = 1

let arrows = document.querySelectorAll(".calendarArrow")
let currentWeek = document.querySelector(".currentWeek > h2:nth-child(2)")
let teamOneElements = document.querySelectorAll('.teamOne p');
let teamTwoElements = document.querySelectorAll('.teamTwo p');
const scoreElements = document.querySelectorAll('.gameScore p')

function fetchWeekGames(matchday) {

    const response = matchday ? fetch(`/calendar?matchday=${Number(matchday)}`) : fetch(`/calendar`);
   
    response
    .then(response => response.json())
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            
            scoreElements[i].textContent = "-";

            teamOneElements[i].textContent = data[i].team_one;
            teamTwoElements[i].textContent = data[i].team_two;

            if (data[i].home_goals && data[i].away_goals) {
                const score = data[i].home_goals + " : " + data[i].away_goals
                scoreElements[i].textContent = score;
            }
        }

        if (!matchday) currentWeek.textContent = data[0].matchday.toString();
    }) 
}

function changeButtonState() {

    if (currentWeek.textContent == MIN_WEEK) {
        arrows[0].setAttribute('disabled', '')
        arrows[0].style.cssText = 'background-color: #F4F5F6;'
        arrows[0].querySelector('span').style.cssText = 'color: #B7B8B9;'   
    }

    if (currentWeek.textContent == MAX_WEEK) {
        arrows[1].setAttribute('disabled', '')
        arrows[1].style.cssText = 'background-color: #F4F5F6;'
        arrows[1].querySelector('span').style.cssText = 'color: #B7B8B9;'
    }

    if (currentWeek.textContent == MIN_WEEK + 1) {
        arrows[0].removeAttribute('disabled', '');
        arrows[0].style.cssText = '';
        arrows[0].querySelector('span').style.cssText = '';
    }
    
    if (currentWeek.textContent == MAX_WEEK - 1) {
        arrows[1].removeAttribute('disabled', '')
        arrows[1].style.cssText = '';
        arrows[1].querySelector('span').style.cssText = '';
    }
}


// INITIAL RENDERING

changeButtonState();
fetchWeekGames(currentWeek.textContent);

let lastGameGoals = document.querySelectorAll('.playerRank td:last-child')

lastGameGoals.forEach( (goalDisplay) => {
    goalAmount = Number(goalDisplay.textContent)
    if (goalAmount> 3) {goalDisplay.textContent = `⚽️ x${goalAmount}`}
    else if (goalAmount == 0) {goalDisplay.textContent = '❌'}
    else {goalDisplay.textContent = '⚽️'.repeat(goalAmount)}
})


// EVENT HANDLING

arrows[0].addEventListener('click', () => {
   
    currentWeek.textContent--;

    fetchWeekGames(currentWeek.textContent);

    changeButtonState();
})


arrows[1].addEventListener('click', () => {
    currentWeek.textContent++;

    fetchWeekGames(currentWeek.textContent);

    changeButtonState();
})
