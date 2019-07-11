# DHIS2 generic interface

This acts as the entry point for the DHIS2 generic interface.

## Dependencies

The mediator uses a number of projects and dependencies to work properly:

- [NodeJS > v10.12](https://nodejs.org/en/download/ "node")
- [MySQL v5.5](https://dev.mysql.com/downloads/mysql/ "mysql")
- [adx-products-populator](https://github.com/BaobabHealthTrust/adx-products-populator)

## Installation

### step 1: clone the project

Clone this repository into your local directory, Use the commands below:

```sh
# clone project to a computer
git clone https://github.com/BaobabHealthTrust/dhis2-integration-mediator.git

# navigate to the project root directory
cd dhis2-integration-mediator
```

### step 2: dependencies installation

Install all the dependencies

```sh
# install dependencies
npm install
```

### step 3: database configuration

Create a `mysql.datasource.json` file with the contents of your mysql.datasource.example.json file.

```sh
# copy the .env.example to .env file
cp src/datasources/mysql.datasource.example.json src/datasources/mysql.datasource.json
```

Modify the `mysql.datasource.json` file and make sure it reflects your database configurations.

### step 4: environmental variables

Create a `.env` file with the contents of your .env.example file.

```sh
# copy the .env.example to .env file
cp .env.example .env
```

Modify the `.env` file and make sure it reflects the environment settings.

### step 5: start the work

__NB: This step requires your instance on the OpenHIM to be running__

```sh
# start the worker
npm start
```
