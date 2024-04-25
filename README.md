# formfactor

Build forms and collect reports.

## Requirements

- nodejs, v21.1+
- docker-compose


### overview

![formfactor](./assets/formfactor.svg?raw=True)

### hld

![formfactor-hld](./assets/formfactor-hld.svg?raw=True)


### lld
![formfactor-lld](./assets/formfactor-lld.svg?raw=True)


## Design

### Functional Assumptions

1. **User Registration**:
   - Users should be able to register to the system to create survey forms.
   - Registration process should include email verification for account activation.

2. **Form Creation**:
   - Registered users should be able to create survey forms.
   - Forms should support various question types (e.g., text, multiple choice, dropdown).
   - Users should be able to customize form settings (e.g., visibility, expiry, archival).

3. **Survey Participation**:
   - Any user, registered or not, should be able to take surveys.
   - Rate limiter should limit the number of form submissions to prevent abuse.
   - Use of Google Recaptcha to prevent abuse.

4. **Analytics and Reporting**:
   - Form creators should have access to analytics data and results of their surveys.
   - Reporting functionality should include visualization of survey responses (e.g., charts, graphs).

5. **Email Reports**:
   - Automated weekly or biweekly email reports should be sent to registered users with summary statistics of survey responses.

### Scaling Assumptions:

1. **Scalability**:
   - The system should be able to handle a large number of users and concurrent survey submissions.
   - Read and write patterns need to be checked.
   - Analytics and Form Service can be decoupled.
   - For viewing form submissions, a read replica is preferred. 
   - We do not have strong causality requirements for form submissions. But in case master fails
     we can show stale data on analytics to intended users
   - Architecture should be scalable to accommodate future growth.

2. **Security**:
   - User authentication and authorization should be implemented securely.
   - Passowrd, AccessToken should be encrypted.
   - Hard checks on user inputs to prevent timing attack.
   - Rate limiters to prevent too many submissions or creations.
   - S3 buckets to store pre-generate repots should be encrypted and protected with IAM like policies.

3. **Reliability**:
   - The system should have high availability to ensure users can access the platform and submit surveys without interruptions.
   - We can have sharded database with a replicaset for each shard to begin with. The shards are hashed by `orgID`.
   - Dabase and S3 buckets can be archived periodically. Especially expired forms.

4. **Performance**:
   - The system should respond quickly to user actions, such as form creation, survey participation, and data analysis.
   - Load testing should be performed to ensure the system can handle expected levels of traffic.


5. **Usability**:
   - The user interface should be intuitive and user-friendly, making it easy for users to create forms, participate in surveys, and view analytics.
   - Accessibility features should be implemented to accommodate users with disabilities.

6. **Compliance**:
   - Not sure.

7. **Monitoring and Logging**:
   - Comprehensive monitoring and logging should be implemented to track system usage, performance, and security incidents.
   - Logs should be regularly reviewed for anomalies and suspicious activities.
   - Monitoring can help to archive forms with no reponses faster
   - Read replicas going out of sync should be also monitored


### APIs

The implemented APIs are available in ./formfactor-insomnia.yaml. This can be
imported to postman. [Guide here](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-from-insomnia/)

The Main Flows have been captured in [Flow.md](./FLOW.md)


### Running

```
npm install && make run
```


**Manual steps to run**

```
cd ./infra/mongo-cluster
docker-compose up
bash ./init-sh

cd ../
cd ./mysql
docker-compose up -d

cd ../../

node cmd/cli/index.mjs migrate -c ./config/.env -d mongo
node cmd/cli/index.mjs migrate -c ./config/.env -d mysql -f ./database/mysql/00001_create_tables.up.sql
node cmd/cli/index.mjs seed -c ./config/.env

node cmd/server/index.mjs
```