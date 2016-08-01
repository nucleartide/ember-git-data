
compile:
	@tsc --target ES2015 \
    addon/typings/ember.d.ts \
    addon/blob.ts \
    addon/repo.ts

.PHONY: compile

