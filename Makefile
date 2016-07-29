
compile:
	@tsc --target ES2015 --noResolve \
    addon/repo.ts \
    addon/utils/b64-decode-unicode.ts \
    addon/utils/b64-encode-unicode.ts \
    addon/utils/basename.ts \
    addon/typings/ember.d.ts

.PHONY: all

