VERSION := $(shell jq -r .version manifest.json)
ZIP_FILE := naver-works-calendar-notifier-$(VERSION).zip

package: build
	zip $(ZIP_FILE) -r asset dist manifest.json

build:
	cd app && npm run build
