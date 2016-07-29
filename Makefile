
#all:
#	@watch -i 5 make compile
#	@echo 'building...'

compile:
	@tsc --target ES2015 --noResolve addon/utils/repo.ts addon/typings/ember.d.ts

.PHONY: all

