from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Q
import random

class Season(models.Model):
    number = models.IntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

class Team(models.Model):
    name = models.CharField(max_length=30)
    seasons = models.ManyToManyField(Season)

    def __str__(self) -> str:
        return self.name
    
    def calculate_statistics(self):
        from .models import Game
        games = Game.objects.filter(Q(team_one=self) | Q(team_two=self) | Q(referee_team=self))

        games_played = 0
        goals_scored = 0
        goals_conceded = 0
        wins = 0
        draws = 0
        losses = 0
        refereed_games = 0

        for game in games:
            if not game.home_goals:
                continue
            games_played += 1

            if game.team_one == self:
                goals_scored += game.home_goals
                goals_conceded += game.away_goals

                if game.home_goals > game.away_goals:
                    wins += 1
                elif game.home_goals < game.away_goals:
                    losses += 1
                else:
                    draws += 1
            
            elif game.team_two == self:
                goals_scored += game.away_goals
                goals_conceded += game.home_goals

                if game.home_goals > game.away_goals:
                    losses += 1
                elif game.home_goals < game.away_goals:
                    wins += 1
                else:
                    draws += 1
            
            else:
                refereed_games += 1

        points = wins * 3 + draws
        goal_difference = goals_scored - goals_conceded

        return { "team": self.name, 
                "games_played" : games_played,
                "wins" : wins,
                "draws" : draws,
                "losses" : losses,
                "goals_scored" : goals_scored,
                "goals_conceded" : goals_conceded,
                "goal_difference" : goal_difference,
                "refereed_games" : refereed_games,
                "points" : points
                }

            

class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, unique=True)
    first_name = models.CharField(max_length=20)
    last_name = models.CharField(max_length=20)
    team = models.ForeignKey(Team, on_delete=models.DO_NOTHING)
    captain = models.BooleanField()

    def save(self, *args, **kwargs):
        if self.captain:
            existing_captain = Player.objects.filter(team=self.team, captain=True)
            if existing_captain.exists():
                raise ValidationError("This team already has a captain.")
        super().save(*args, **kwargs)


class Game(models.Model):
    season = models.ForeignKey(Season, on_delete=models.DO_NOTHING)
    matchday = models.IntegerField()
    team_one = models.ForeignKey(Team, on_delete=models.DO_NOTHING, related_name="team_one")
    team_two = models.ForeignKey(Team, on_delete=models.DO_NOTHING, related_name="team_two")
    referee_team = models.ForeignKey(Team, on_delete=models.DO_NOTHING, related_name="referee_team", null=True, blank=True)
    team_one_home_goals= models.IntegerField(null=True, blank=True)
    team_one_away_goals= models.IntegerField(null=True, blank=True)
    team_two_home_goals= models.IntegerField(null=True, blank=True)
    team_two_away_goals= models.IntegerField(null=True, blank=True)
    agreed = models.BooleanField(null=True, blank=True)
    home_goals = models.IntegerField(null=True, blank=True)
    away_goals = models.IntegerField(null=True, blank=True)

    def __str__(self) -> str:
        return str(self.team_one) + " - " + str(self.team_two)
    
    def get_calendar():
        calendar = []
        games = Game.objects.exclude(Q(team_one__name="off") | Q(team_two__name="off"))
        for game in games:
            calendar.append({
                "matchday" : game.matchday,
                "team_one" : game.team_one.name,
                "team_two" : game.team_two.name,
                "home_goals" : game.home_goals,
                "away_goals" : game.away_goals,
            })
        
        calendar = sorted(calendar, key=lambda game: game['matchday'])
        return calendar
    
    def get_matchday_fixtures(matchday):
        calendar = []
        games = Game.objects.exclude(Q(team_one__name="off") | Q(team_two__name="off")).filter(matchday=matchday)
        for game in games:
            calendar.append({
                "matchday" : game.matchday,
                "team_one" : game.team_one.name,
                "team_two" : game.team_two.name,
                "home_goals" : game.home_goals,
                "away_goals" : game.away_goals,
            })
        
        calendar = sorted(calendar, key=lambda game: game['matchday'])
        return calendar

            

    
class Goal(models.Model):
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING)
    player = models.ForeignKey(Player, on_delete=models.DO_NOTHING, null=True, blank=True)

class TeamRank(models.Model):
    matchday = models.IntegerField()
    team = models.ForeignKey(Team, on_delete=models.DO_NOTHING)
    refereed_games = models.IntegerField()
    wins = models.IntegerField()
    draws = models.IntegerField()
    losses = models.IntegerField()
    points = models.IntegerField()
    goals_scored = models.IntegerField()
    goals_conceded = models.IntegerField()

    def __str__(self) -> str:
        return str(self.team)

class PlayerRank(models.Model):
    matchday = models.IntegerField()
    player = models.ForeignKey(Player, on_delete=models.DO_NOTHING)
    goals = models.IntegerField()
