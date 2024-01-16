echo "Building app..."
version=$(cat ../manifest.json | jq -r '.version')

npm run clean && \
npm run eslint && \
cross-env BUILD_VERSION=$version parcel build --detailed-report --no-source-maps

echo "Done."
