# Changesets

Every pull request that changes the icons adds one note here: `npx changeset`, pick patch (a fixed drawing),
minor (new icons) or major (a removed or renamed icon), and say what changed in a line. On merge to `main` the release
workflow opens a "Version Packages" pull request; merging that one publishes to npm.
