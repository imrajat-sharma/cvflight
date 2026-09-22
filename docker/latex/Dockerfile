FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base texlive-latex-recommended texlive-latex-extra \
    texlive-fonts-recommended lmodern \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir /work && chmod 1777 /work
ENV openin_any=p openout_any=p HOME=/work
USER 65534:65534
WORKDIR /work
# The application supplies a fixed command and passes LaTeX over stdin.
# All writable paths are ephemeral tmpfs mounts supplied by compileService.
CMD ["pdflatex", "--version"]
