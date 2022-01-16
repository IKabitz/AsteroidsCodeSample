# AsteroidsCodeSample
This is the repository containing all source code and other resources for my Asteroids code sample project.

# What am I looking at?
Good question! This repository contains two things, mainly:

 1. The source for the very cool React Serverless Site you can use to search for Asteroids, and
 2. The source code of the Node.js AWS lambda function which performs the request to the NASA NeoWS API to obtain asteroid information.

## Accessing the Asteroid Site
You can find the asteroid site here [https://d2oi30iof9lndn.cloudfront.net/index.html](https://d2oi30iof9lndn.cloudfront.net/index.html)
In order to use the search functionality, you'll need a secret key (The API Gateway key).

In a real production scenario, we would lock access to the website down with AWS Cognito. This can be expensive if you don't keep a close eye on your AWS Billing information (Which I could be better at).

## How does it all work?
Altogether, the application is a serverless React website, hosted on AWS S3, distributed through CloudFront, that accesses the Asteroids API Gateway.

The Asteroids API Gateway integrates directly with a Node.js lambda, which contacts NASA's NeoWS API to search for near earth objects.

## Why the infrastructure?
This application, as it is configured, is:
 1. Scalable (Site is configured through CloudFront which has extremely high throughput, backend is setup with lambda and API Gateway).
 2. Modular (Can be easily extended to be used in other front ends).
 3. Auditable (Usage and access data is all logged in CloudWatch).
This is a fully functional website that could handle high traffic, and could be configured to be served quickly to international users if needed.