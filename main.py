import torch
from diffusers import StableDiffusionPipeline
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator
import uvicorn
from pathlib import Path
import os

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


class Settings(BaseModel):
    guidance_scale: float = Field(7.5, ge=1, le=20)
    num_steps: int = Field(50, ge=20, le=150)
    image_size: str = Field("512x512")
    model_version: str = Field("CompVis/stable-diffusion-v1-4")
    use_half_precision: bool = True
    safety_checker: bool = True
    nsfw_filter: bool = True
    output_format: str = Field("png")
    save_metadata: bool = True
    seed: int = None
    num_images: int = Field(1, ge=1, le=10)
    eta: float = Field(0.0, ge=0.0, le=1.0)

    @validator("image_size")
    def validate_image_size(self, v):
        width, height = v.split("x")
        if not (width.isdigit() and height.isdigit()):
            raise ValueError('image_size must be in the format "widthxheight"')
        return v


class GenerateRequest(BaseModel):
    prompt: str
    settings: Settings


class StableDiffusionGenerator:
    def __init__(self):
        self.pipeline = None
        self.current_model = None
        self.custom_model_path = None

    def load_pipeline(self, model_version, use_half_precision, settings):
        if (
            self.pipeline is None
            or self.current_model != model_version
            or self.custom_model_path
        ):
            model_path = (
                self.custom_model_path if self.custom_model_path else model_version
            )
            self.pipeline = StableDiffusionPipeline.from_pretrained(
                model_path,
                torch_dtype=torch.float16 if use_half_precision else torch.float32,
                variant="fp16" if use_half_precision else None,
                safety_checker=None if not settings.safety_checker else None,
            )
            if settings.safety_checker and self.pipeline is not None:
                self.pipeline.safety_checker = self.pipeline.safety_checker
            self.current_model = model_version
            self.pipeline = self.pipeline.to("cuda")
            self.pipeline.enable_attention_slicing()
            try:
                self.pipeline.enable_xformers_memory_efficient_attention()
            except ModuleNotFoundError:
                print(
                    "xformers is not installed. Skipping xformers memory efficient attention."
                )
            self.custom_model_path = None

    def generate(self, prompt: str, settings: Settings) -> str:
        self.load_pipeline(
            settings.model_version, settings.use_half_precision, settings
        )

        # Parse image size
        width, height = map(int, settings.image_size.split("x"))

        generator = (
            torch.manual_seed(settings.seed) if settings.seed is not None else None
        )

        with torch.autocast("cuda"):
            images = self.pipeline(
                prompt,
                guidance_scale=settings.guidance_scale,
                num_inference_steps=settings.num_steps,
                width=width,
                height=height,
                num_images_per_prompt=settings.num_images,
                eta=settings.eta,
                generator=generator,
            ).images

        os.makedirs("output", exist_ok=True)

        image_paths = []
        for i, image in enumerate(images):
            save_path = f"output/generated_image_{i}.{settings.output_format}"
            if settings.save_metadata:
                metadata = {"prompt": prompt, "settings": settings.dict()}
                image.save(
                    save_path,
                    format=settings.output_format.upper(),
                    params={"metadata": str(metadata)},
                )
            else:
                image.save(save_path)
            image_paths.append(save_path)

        return image_paths


generator = StableDiffusionGenerator()


@app.get("/")
async def read_root():
    return FileResponse("static/index.html")


@app.post("/generate")
async def generate_image(request: GenerateRequest):
    try:
        image_paths = generator.generate(request.prompt, request.settings)
        return {"status": "success", "image_paths": image_paths}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload_model")
async def upload_model(file: UploadFile = File(...)):
    try:
        model_path = f"models/{file.filename}"
        os.makedirs("models", exist_ok=True)
        with open(model_path, "wb") as buffer:
            buffer.write(file.file.read())
        generator.custom_model_path = model_path
        return {"status": "success", "model_path": model_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image/{image_name}")
async def get_image(image_name: str):
    image_path = f"output/{image_name}"
    if os.path.exists(image_path):
        return FileResponse(image_path)
    raise HTTPException(status_code=404, detail="Image not found")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
