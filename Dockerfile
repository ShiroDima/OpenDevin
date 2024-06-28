FROM python:3.12
LABEL authors="Akarawak Dima"

ENV PYTHONUNBUFFERED=1

WORKDIR /code

COPY ./pyproject.toml .

RUN pip install --upgrade pip && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev

COPY ./opendevin ./opendevin

COPY ./agenthub ./agenthub

# Add the working directory to the Python path
ENV PYTHONPATH="${PYTHONPATH}:/code"

EXPOSE 3000

ENTRYPOINT ["uvicorn", "opendevin.server.listen:app", "--host", "0.0.0.0", "--port", "3000"]