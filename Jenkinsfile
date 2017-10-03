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
            s3Upload(file: "dist/index.js", bucket: "bambora-static-prod-eu-west-1", path: "wallet/latest/wallet.min.js")
        }
    }

    stage("Invalidate Bambora CDN Cache") {
        if (env.BRANCH_NAME == "master") {
            def outputs = cfnDescribe(stack:"Static-Prod")
            cfInvalidate(distribution:outputs.get("Distribution"), paths:["/wallet/latest/*"])
        }
    }
}