package: build
	zip naver-works-calendar-notifier.zip asset dist manifest.json

build:
	cd app && npm run build
