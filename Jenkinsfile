#!groovy

def utils = new com.bambora.jenkins.pipeline.Utils()

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
            utils.slack("Commenced upload of `/wallet/latest/wallet.min.js`.", "#static-ci", "info")
            s3Upload(file: "dist/index.js", bucket: "bambora-static-prod-eu-west-1", path: "wallet/latest/wallet.min.js")
        }
    }
    post {
        success {
            utils.slack("Completed upload of `wallet/latest/wallet.min.js`.", "#static-ci", "good")
        }
        failure {
            utils.slack("Failed to upload `wallet/latest/wallet.min.js`!", "#static-ci", "danger")
        }
    }
}