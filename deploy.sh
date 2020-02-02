#!/usr/bin/env bash

set -e

sudo apt-get install gettext

envsubst < app.yaml.template > app.yaml

if [[ ! $(command -v gcloud) ]]; then
    echo 'Installing gcloud sdk'
    sudo apt-get install python
    wget https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-214.0.0-linux-x86_64.tar.gz
    tar xzf google-cloud-sdk-214.0.0-linux-x86_64.tar.gz
    ./google-cloud-sdk/install.sh -q
    sudo cp -R google-cloud-sdk/* /usr/local
fi

echo ${GCLOUD_SERVICE_KEY} | base64 --decode > ${HOME}/ivycode-service-key.json
gcloud auth activate-service-account --key-file=${HOME}/ivycode-service-key.json
gcloud config set project ${GOOGLE_PROJECT_ID}
gcloud --quiet config set compute/zone ${GOOGLE_COMPUTE_ZONE}
gcloud auth list
echo ${GOOGLE_PROJECT_ID}
echo ${GCLOUD_SERVICE_KEY   }

gcloud app deploy --project=${GOOGLE_PROJECT_ID} --quiet
