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
        goals_ranking = models.Player.objects.annotate(num_goals=Count('goal'))

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
        print(current_matchday)
        games = models.Game.get_matchday_fixtures(current_matchday)
        

        return render(request, 'dashboard.html', 
                      {
                          "games": games,
                          "rankings" : teams_ranking,
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


