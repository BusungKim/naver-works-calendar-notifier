echo "Building app..."
version=$(cat ../manifest.json | jq -r '.version')

rm -rf ./parcel-cache && \
npm run clean && \
npm run eslint && \
cross-env BUILD_VERSION=$version PARCEL_WORKERS=0 parcel build --detailed-report --no-source-maps

echo "Done."
