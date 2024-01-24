from . import models
import random
import datetime
from django.db.models.functions import ExtractWeek
from django.db.models import Count
from django.core import serializers
import json



# Function to calculate calendar
def get_fixtures():

    fixtures = []
    season = models.Season.objects.order_by('-number').first()

    teams = list(models.Team.objects.all())
    random.shuffle(teams)

    for round in range(7):
        fixtures.append([])
        index = 0

        while len(fixtures[round]) != 4:
            fixtures[round].append((teams[index], teams[len(teams) - 1 - index]))
            index += 1

        last_team = teams.pop(-1)
        teams.insert(1, last_team)
    
    for index, matchday in enumerate(fixtures):
        matchday_index = index + 1
        for game in matchday:
            team1 = game[0]
            team2 = game[1]
            models.Game.objects.create(season=season, matchday=matchday_index, team_one=team1, team_two=team2)

def export_calendar():
    calendar = []
    games = models.Game.objects.all()
    for game in games:
        calendar.append({
                    "matchday" : game.matchday,
                    "team_one" : game.team_one.name,
                    "team_two" : game.team_two.name,
                })

    with open("dashboard/static/calendar.json", "w") as outfile:
        outfile.write(json.dumps(calendar, indent=4))


def randomize_games():
    games = models.Game.objects.all()

    for game in games:
        teams = []
        teams.append(game.team_one)
        teams.append(game.team_two)
        random.shuffle(teams)
        game.team_one = teams[0]
        game.team_two = teams[1]
        game.save()
    
# Function to calculate rankings each game
            
def get_current_matchday():
    season = models.Season.objects.order_by('-number').first()
    current_week = datetime.datetime.now().isocalendar()[1]
    first_week = season.start_date.isocalendar()[1]

    current_matchday = current_week - first_week + 1
    if current_matchday < 1:
        current_matchday = 1
    return current_matchday
    