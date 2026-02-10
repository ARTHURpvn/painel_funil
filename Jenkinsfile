pipeline {
  agent any

  environment {
    APP_NAME = "nte-dashboard"
    PORT = "3000"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Show files') {
      steps {
        sh 'ls -la'
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build || echo "no build step"'
      }
    }

    stage('Start / Restart') {
      steps {
        sh '''
        pm2 delete $APP_NAME || true
        PORT=$PORT pm2 start npm --name "$APP_NAME" -- start
        pm2 save
        '''
      }
    }
  }
}