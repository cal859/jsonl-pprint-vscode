.PHONY: publish compile

publish: compile
	vsce publish

compile:
	npm run compile
