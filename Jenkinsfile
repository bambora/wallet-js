#!groovy

def utils = new com.bambora.jenkins.pipeline.Utils()

def getGitTag() {
    def tag = sh script: "git describe --exact-match --tags \$(git log -n1 --pretty='%h')", returnStdout: true
    return tag
}

node("docker-concurrent") {
    checkout scm

    try {
        gitTag = getGitTag()
        hasGitTag = true
    } catch(error) {
        hasGitTag = false
    }

    stage("Build") {
        if (env.BRANCH_NAME == "master" && hasGitTag) {
            docker.image("node:7.0").inside("-u 0:0") {
                sh "npm install"
                env.NODE_ENV = "production"
                sh "npm run build"
            }
        }
    }

    stage("Publish to Bambora CDN") {
        if (env.BRANCH_NAME == "master" && hasGitTag) {
            s3Upload(
                file: "dist/index.js",
                bucket: "bambora-static-prod-eu-west-1",
                path: "wallet/latest/wallet.min.js"
            )

            s3Upload(
                file: "dist/index.js",
                bucket: "bambora-static-prod-eu-west-1",
                path: "wallet/${gitTag}/wallet.min.js"
            )
        }
    }

    stage("Invalidate Bambora CDN Cache") {
        if (env.BRANCH_NAME == "master" && hasGitTag) {
            def outputs = cfnDescribe(stack:"Static-Prod")

            cfInvalidate(
                distribution: outputs.get("Distribution"),
                paths: [
                    "/wallet/latest/*",
                    "/wallet/${gitTag}/*"
                ]
            )
        }
    }
}