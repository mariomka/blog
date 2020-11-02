---
title: Comparando ClickHouse contra PostgreSQL para analíticas
date: 2020-10-02
author: Mario Juárez
---

> ClickHouse es un DBMS de código abierto orientado a columnas, creado por Yandex para su servicio de analítica web (el segundo más grande después de Google Analytics).

El objetivo de este post es introducirte a las bases de datos orientadas a columnas y que tu mismo compruebes
si pueden ser útiles en retos que tengas ahora o en el futuro.

## Dataset

Vamos a descargar datos desde [Github Archive](https://www.gharchive.org/) para realizar las pruebas.

Descargamos todos los eventos para agosto de 2020 son **46 469 374 filas** y pesa en total **4 GB**.

Utilizamos `curl` para descargar, `parallel` para levantar varios procesos y `jq` para procesar
la respuesta JSON y crear un fichero CSV.

```sh
parallel -j 6 curl ::: https://data.gharchive.org/2020-08-{01..31}-{0..23}.json.gz | \
gzip -d | \
jq -r "[.id, .type, .created_at, .actor.login, .repo.name] | @csv" > data.csv
```

## Contenedores

Mientras se completa la descarga, vamos arrancando los contenedores docker para PostgreSQL y para ClickHouse.

### PostgreSQL

Abrimos una terminal y ejecutamos:

```sh
docker run -d -v $(pwd):/data --name postgres -e POSTGRES_PASSWORD=password postgres
docker exec -it postgres psql -U postgres
```

Ya tenemos lista la consola para ejecutar comandos. 

### ClickHouse

Abrimos otra terminal y ejecutamos:

```sh
docker run -d -v $(pwd):/data --name clickhouse yandex/clickhouse-server
docker exec -it clickhouse clickhouse-client
```

También tenemos lista la consola para ejecutar comandos.

## Base de datos y tablas

Vamos a crear una base de datos y una tabla.

### PostgreSQL

```sql
CREATE DATABASE test_database;

\c test_database;

CREATE TABLE gh_events (
  id bigint,
  event varchar,
  date timestamp with time zone,
  username varchar,
  repository varchar
);
```

### ClickHouse

```sql
CREATE DATABASE test_database;

USE test_database;

CREATE TABLE gh_events (
  id Int64,
  event String,
  date DateTime('UTC'),
  username String,
  repository String
) ENGINE = MergeTree ORDER BY (username);
```

## Importar el dataset

Importamos el CSV (una vez terminen de descargarse).

### PostgreSQL

```sql
COPY gh_events FROM '/data/data.csv'  WITH (FORMAT csv);
```

La tabla pesa **4 599 MB**.

### ClickHouse

Para importar en ClickHouse se utiliza el comando `clickhouse-client`, por lo que necesitamos una nueva terminal:

```bash
docker exec -it clickhouse bash
```

Y ejecutamos:

```bash
clickhouse-client -d test_database --date_time_input_format best_effort --query="INSERT INTO gh_events FORMAT CSV" < /data/data.csv
```

La tabla pesa **746 MB**. 

## Queries

¡Empezamos a lanzar queries!

> Antes de nada, activamos el `timing` en PostgreSQL con: `\timing`

### Query 1
```sql
SELECT username, COUNT(*)
FROM gh_events
GROUP BY username
ORDER BY COUNT(*)
DESC LIMIT 10;
```

### Query 2
```sql
SELECT event, COUNT(*)
FROM gh_events
GROUP BY event
ORDER BY COUNT(*)
DESC LIMIT 10;
```

### Query 3
```sql
SELECT repository, COUNT(*)
FROM gh_events
GROUP BY repository
ORDER BY COUNT(*)
DESC LIMIT 10;
```

### Query 4
```sql
-- postgresql
SELECT date_trunc('day', "date" AT TIME ZONE 'UTC') AS day, COUNT(*)
FROM gh_events
GROUP BY date_trunc('day', "date" AT TIME ZONE 'UTC')
ORDER BY day ASC, COUNT(*);

-- clickhouse
SELECT toStartOfDay(date) AS day, COUNT(*)
FROM gh_events
GROUP BY toStartOfDay(date)
ORDER BY day ASC, COUNT(*) DESC;
```

### Query 5
```sql
-- postgresql
SELECT date_trunc('hour', "date" AT TIME ZONE 'UTC') AS hour, COUNT(*)
FROM gh_events
WHERE date BETWEEN '2020-08-01 00:00:00' AND '2020-08-01 23:59:59'
GROUP BY date_trunc('hour', "date" AT TIME ZONE 'UTC')
ORDER BY hour ASC, COUNT(*);

-- clickhouse
SELECT toStartOfHour(date) AS hour, COUNT(*)
FROM gh_events
WHERE date BETWEEN '2020-08-01 00:00:00' AND '2020-08-01 23:59:59'
GROUP BY toStartOfHour(date)
ORDER BY hour ASC, COUNT(*) DESC;
```

## Resultados

| Query  | PostgreSQL time (ms) | ClickHouse time (ms) |
| ------ | -------------------- | -------------------- |
| 1      | 44 420               | 611                  |
| 2      | 9 966                | 274                  |
| 3      | 59 702               | 2 085                |
| 4      | 17 527               | 252                  |
| 5      | 10 595               | 170                  |

La ventaja que ofrece ClickHouse en consultas a grandes cantidades de datos es evidente.

Quizás te estás preguntando si mejoraría el rendimiento en PostgreSQL con unos buenos índices. Puedes probarlo tu mismo,
pero te adelanto que no mejora mucho. La diferencia se debe a la cantidad de datos que son leídos de disco.

## Limpiando

Vamos a limpiar todo:

```sh
rm -rf data.csv
docker stop postgres clickhouse
docker rm postgres clickhouse
```

## Para saber más

Tan solo hemos probado superficialmente ClickHouse, recomiendo echar un vistazo a la [documentación oficial](https://clickhouse.tech/docs/en).
Por ejemplo, una de las características más interesante de ClickHouse es el motor [AggregatingMergeTree](https://clickhouse.tech/docs/en/engines/table-engines/mergetree-family/aggregatingmergetree/).

También recomiendo seguir a Javi Santana en [Twitch](https://www.twitch.tv/qualopy), está haciendo unos streams muy interesantes de ClickHouse.

Además, dejo algunos enlaces que me han ayudado con este post:

- [https://medium.com/@george3d6/clickhouse-an-analytics-database-for-the-21st-century-82d3828f79cc](https://medium.com/@george3d6/clickhouse-an-analytics-database-for-the-21st-century-82d3828f79cc)
- [https://blog.tinybird.co/2020/03/11/create-analytic-static-applications](https://blog.tinybird.co/2020/03/11/create-analytic-static-applications)
