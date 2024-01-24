from django.contrib import admin
from . import models

admin.site.register(models.Team)
admin.site.register(models.Season)
admin.site.register(models.Player)
admin.site.register(models.Game)
admin.site.register(models.Goal)
admin.site.register(models.PlayerRank)
admin.site.register(models.TeamRank)