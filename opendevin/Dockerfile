FROM python:3.12
LABEL authors="Akarawak Dima"

ENV PYTHONUNBUFFERED=1

WORKDIR /code

COPY ./pyproject.toml .
COPY ./poetry.lock .

RUN python3 -m venv venv && ls -l
RUN . venv/bin/activate

RUN pip install poetry && poetry install

COPY . .

EXPOSE 3000

ENTRYPOINT ["uvicorn", "server.listen:app", "--host", "0.0.0.0", "--port", "3000"]