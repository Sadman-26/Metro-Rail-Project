# Generated by Django 4.2.20 on 2025-04-18 07:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metro', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='lostitem',
            name='date',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
