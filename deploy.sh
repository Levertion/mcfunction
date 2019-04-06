echo "Starting deploy script"
if [[ `git log -1 --pretty=%B` != "Publish"* ]]; then
 if [ -z "$CI" ]; then
    echo "This commit would run the deploy step"
  else
    echo "Checking out $TRAVIS_BRANCH"
    git checkout $TRAVIS_BRANCH
    if [ $TRAVIS_COMMIT == `git rev-parse HEAD` ]; then
      echo "Resetting to $TRAVIS_COMMIT"
      echo //registry.npmjs.org/:_authToken=${NPM_TOKEN} > .npmrc
      git update-index --skip-worktree .npmrc

      git reset --hard $TRAVIS_COMMIT
      npx lerna publish --dist-tag next --yes
      git config user.email "travis@travis-ci.org"
      git config user.name "Travis CI"
      # Silence it to not expose the GH_TOKEN
      git remote set-url origin "https://Levertion:$GH_TOKEN@github.com/$TRAVIS_REPO_SLUG" > /dev/null 2>&1
      git push --all --quiet
      git push --tags --quiet
      echo "Checking out $TRAVIS_COMMIT"
      git checkout $TRAVIS_COMMIT --quiet
    else
      echo "Not on latest $TRAVIS_BRANCH, not pushing"
    fi
  fi
fi
