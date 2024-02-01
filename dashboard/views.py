from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from . import models, utils
import datetime
from itertools import groupby
from django.db.models import Count, Q
import json
from django.http import JsonResponse
from django.core import serializers



class DashboardView(View):
    def get(self, request):

        # Query goals ranking
        players_ranking = models.Player.objects.annotate(num_goals=Count('goal')).order_by('-num_goals')
        if len(players_ranking) > 10:
            players_ranking = players_ranking[:10]

        goals_ranking = []

        for player in players_ranking:
            team_name = player.team.name
            player_stats = {}
            player_stats['name'] = player.first_name + ' ' + player.last_name
            player_stats['team'] = team_name
            player_stats['goals'] = player.num_goals

            goals = models.Goal.objects.filter(player=player)
            games_played = models.Game.objects.filter(Q(team_one__name=team_name) | Q(team_two__name=team_name)).filter(home_goals__isnull=False)
            last_game_played = games_played.order_by("-matchday")[0]

            all_game_goals = last_game_played.goal_set.all()
            player_goals = 0
            for goal in all_game_goals:
                if goal.player == player:
                    player_goals += 1
            
            player_stats['last_game'] = player_goals
            goals_ranking.append(player_stats)


        # Query teams ranking
        teams_ranking = []
        teams = models.Team.objects.exclude(name="off")
        for team in teams:
            stats = models.Team.calculate_statistics(team)
            teams_ranking.append(stats)

        teams_ranking = sorted(teams_ranking, 
                               key=lambda stats: 
                               (
                                   -stats['points'], 
                                   -stats['refereed_games'], 
                                   -stats['goal_difference'], 
                                   -stats['goals_scored'], 
                                   stats['team']
                                ))
        
        # Query calendar

        current_matchday = utils.get_current_matchday()
        games = models.Game.get_matchday_fixtures(current_matchday)
        

        return render(request, 'dashboard.html', 
                      {
                          "games": games,
                          "rankings" : teams_ranking,
                          "goals_ranking" : goals_ranking,
                      })
    
class CalendarView(View):
    def get(self, request):
        matchday = request.GET.get('matchday', utils.get_current_matchday())
        data = models.Game.get_matchday_fixtures(matchday)
        return JsonResponse(data, safe=False)
    
class RulesView(View):
    def get(self, request):
        return render(request, 'rules.html')

class ContactView(View):
    def get(self, request):
        return render(request, 'contact.html')


