# Generated by Django 5.0.3 on 2025-02-14 05:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("regular", "Regular"),
                    ("guest", "Guest"),
                ],
                default="guest",
                max_length=10,
            ),
        ),
    ]
