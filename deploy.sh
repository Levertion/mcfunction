if [[ `git log -1 --pretty=%B` != "Publish"* ]]; then
 if [ -z "$CI" ]; then
    echo "This commit would run the deploy step"
  else
    git checkout $TRAVIS_BRANCH
    if [ $TRAVIS_COMMIT == `git rev-parse HEAD` ]; then
      git reset --hard $TRAVIS_COMMIT
      npx lerna publish --dist-tag next --yes
      git config user.email "travis@travis-ci.org"
      git config user.name "Travis CI"
      # Silence it to not expose the GH_TOKEN
      git remote set-url origin https://Levertion:${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG} > /dev/null 2>&1
      git push --quiet
      git checkout $TRAVIS_COMMIT
    else
      echo "Not on latest $TRAVIS_BRANCH, not pushing"
    fi
  fi
fi
