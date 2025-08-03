#!/bin/bash

# Navigate to the backend folder
cd backend

# Create virtual environment with Python 3.10
python3.10 -m venv env
source env/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Run Django commands
python manage.py migrate
python manage.py collectstatic --noinput
