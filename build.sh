#!/bin/bash

# Move into backend directory
cd backend

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements2.txt

# Django setup
python manage.py migrate
python manage.py collectstatic --noinput --clear
