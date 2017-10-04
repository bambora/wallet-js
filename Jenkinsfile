#!groovy

SERVICE = "wallet-js"
SLACK_CHANNEL = "#aal-bambora-online-ci"

def utils = new com.bambora.jenkins.pipeline.Utils()

def getGitTag() {
  def tag = sh script: "git describe --exact-match --tags \$(git log -n1 --pretty='%h')", returnStdout: true
  return tag.trim()
}

def slack(String msg, String channel = "", String color = null) {
  withCredentials([
    [
      $class: "UsernamePasswordMultiBinding",
      credentialsId: "aal-bambora-online-ci",
      usernameVariable: "USERNAME",
      passwordVariable: "PASSWORD"
    ]
  ]) {
    slackSend message: msg, color: color, token: "${env.PASSWORD}", channel: channel
  }
}

def notify_start(message) {
  slack("*${SERVICE} (${env.BRANCH_NAME}):* ${message}", SLACK_CHANNEL, "info")
}

def notify_success(message) {
  slack("*${SERVICE} (${env.BRANCH_NAME}):* ${message}", SLACK_CHANNEL, "good")
}

def notify_failure(message) {
  slack("*${SERVICE} (${env.BRANCH_NAME}):* ${message}", SLACK_CHANNEL, "danger")
}

node("docker-concurrent") {
  checkout scm
  sh "git fetch --tags"

  try {
    gitTag = getGitTag()
    hasGitTag = true
    echo "Has git tag ${gitTag}"
  } catch(error) {
    hasGitTag = false
    echo "Has no git tag"
  }

  stage("Build") {
    if (env.BRANCH_NAME == "master" && hasGitTag) {
      notify_start("Building of ${gitTag} has started...")

      try {
        docker.image("node:7.0").inside("-u 0:0") {
            sh "npm install"
            env.NODE_ENV = "production"
            sh "npm run build"
        }
      } catch (error) {
        notify_failure("Building of ${gitTag} failed!")
        throw error
      }

      notify_success("Building of ${gitTag} was successful.")
    } else {
      echo "Nothing to build"
    }
  }

  stage("Publish to Bambora CDN") {
    if (env.BRANCH_NAME == "master" && hasGitTag) {
      notify_start("Publishing ${gitTag} to the Bambora CDN...")

      try {
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
      } catch (error) {
        notify_failure("Publishing of ${gitTag} to the Bambora CDN failed!")
        throw error
      }
      
      notify_success("""
        Publishing of ${gitTag} to the Bambora CDN was successful.\n
        Direct link: https://static.bambora.com/wallet/latest/wallet.min.js
        Alternate link: https://static.bambora.com/wallet/${gitTag}/wallet.min.js
      """)
    } else {
      echo "Nothing to publish"
    }
  }

  stage("Invalidate Bambora CDN Cache") {
    if (env.BRANCH_NAME == "master" && hasGitTag) {
      notify_start("Invalidating the Bambora CDN cache for ${gitTag}...")

      try {
        def outputs = cfnDescribe(stack:"Static-Prod")

        cfInvalidate(
          distribution: outputs.get("Distribution"),
          paths: [
            "/wallet/latest/*",
            "/wallet/${gitTag}/*"
          ]
        )
      } catch (error) {
        notify_failure("Invalidation of the Bambora CDN cache for ${gitTag} failed!")
        throw error
      }
      
      notify_success("Invalidation of the Bambora CDN cache for ${gitTag} was successful.")
    } else {
      echo "Nothing to invalidate"
    }
  }

  stage("Publish to public NPM") {
    if (env.BRANCH_NAME == "master" && hasGitTag) {
      notify_start("Publishing ${gitTag} to the public NPM repository...")

      try {
        withCredentials([[
          $class: "StringBinding",
          credentialsId: "public-npm-repository",
          variable: "NPM_AUTH_TOKEN"
        ]]) {
          docker.image("node:7.0").inside("-u 0:0") {
            sh "echo '//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN' > .npmrc"
            sh "npm publish --access public"
          }
        }
      } catch (error) {
        notify_failure("Publishing of ${gitTag} to the public NPM repository failed!")
        throw error
      }

      def version = gitTag.substring(1)
      
      notify_success("""
        Publishing of ${gitTag} to the public NPM repository was successful.\n
        Direct link: https://registry.npmjs.org/@bambora/wallet/-/wallet-${version}.tgz
      """)
    } else {
      echo "Nothing to publish"
    }
  }
}