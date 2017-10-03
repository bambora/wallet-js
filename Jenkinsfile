#!groovy

node("docker-concurrent") {
    checkout scm

    stage("Build") {
        if (env.BRANCH_NAME == "master") {
            docker.image("node:7.0").inside("-u 0:0") {
                sh "npm install"
                env.NODE_ENV = "production"
                sh "npm run build"
            }
        }
    }

    stage("Publish to Bambora CDN") {
        if (env.BRANCH_NAME == "master") {
            s3Upload(file: "dist/index.js", bucket: "bambora-static-prod-eu-west-1", path: "wallet/latest/wallet.min.js")
            // sh "aws --region eu-west-1 s3 mv \"\$PWD\"/dist/index.js s3://bambora-static-prod-eu-west-1/wallet/wallet.min.js"
        }
    }
}