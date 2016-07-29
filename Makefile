
compile:
	@tsc --target ES2015 --noResolve \
    addon/typings/ember.d.ts \
    addon/typings/b64-decode-unicode.d.ts \
    addon/utils/array-remove.ts \
    addon/utils/b64-decode-unicode.ts \
    addon/utils/b64-encode-unicode.ts \
    addon/utils/basename.ts \
    addon/blob.ts \
    addon/repo.ts

.PHONY: all

