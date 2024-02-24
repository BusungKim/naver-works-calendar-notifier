VERSION := $(shell jq -r .version manifest.json)
ZIP_FILE := naver-works-calendar-notifier-$(VERSION).zip

package: build
	zip $(ZIP_FILE) -r asset dist manifest.json

build: test
	cd app && npm run build

debug:
	cd app && npm run build-local

unzip:
	rm -rf temp
	mkdir temp
	unzip $(ZIP_FILE) -d temp

test:
	cd app && npm run test
