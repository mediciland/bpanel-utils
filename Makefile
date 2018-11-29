all:
	@npm run browserify

babel:
	@npm run babel

watch:
	@npm run watch

browserify:
	@npm run browserify

webpack:
	@npm run webpack

clean:
	@npm run clean

lint:
	@npm run lint

test:
	@npm test

.PHONY: all browserify webpack clean lint test
