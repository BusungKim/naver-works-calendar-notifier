package: build
	zip works-calendar-auto-call.zip asset dist manifest.json

build:
	cd app && npm run build
