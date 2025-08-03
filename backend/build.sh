#!/bin/bash


cd backend

# Python 3.10 venv
python3.10 -m venv env
source env/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt


python manage.py migrate
python manage.py collectstatic --noinput
