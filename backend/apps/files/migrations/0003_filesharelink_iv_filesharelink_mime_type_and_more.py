# Generated by Django 5.0.3 on 2025-02-14 14:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0002_file_iv"),
    ]

    operations = [
        migrations.AddField(
            model_name="filesharelink",
            name="iv",
            field=models.TextField(default=b"0"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="filesharelink",
            name="mime_type",
            field=models.CharField(default="application/pdf", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="filesharelink",
            name="name",
            field=models.CharField(default="unknown", max_length=255),
            preserve_default=False,
        ),
    ]
