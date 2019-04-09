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
      git config --global user.email "26185209+Levertion@users.noreply.github.com"
      git config --global user.name "Levertion (via CI)"
      # Silence it to not expose the GH_TOKEN
      git remote set-url origin "https://Levertion:$GH_TOKEN@github.com/$TRAVIS_REPO_SLUG"

      # Setup pushing of docs
      git clone --no-checkout  "https://Levertion:$GH_TOKEN@github.com/$TRAVIS_REPO_SLUG" docs
      (
        cd docs
        git checkout origin/gh-pages
        git branch --orphan gh-pages-orphan
      )
      npx lerna publish --dist-tag next --yes 
      (
        cd docs
        git add .
        git commit -m "Update docs"
        git push --force origin gh-pages-orphan:gh-pages
      )
      echo "Checking out $TRAVIS_COMMIT"
      git checkout $TRAVIS_COMMIT --quiet
    else
      echo "Not on latest $TRAVIS_BRANCH, not pushing"
    fi
  fi
fi
