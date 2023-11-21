package: build
	zip naver-works-calendar-notifier.zip -r asset dist manifest.json

build:
	cd app && npm run build
