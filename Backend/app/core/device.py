"""
TruthLens Hardware & Device Management
Manages CUDA device discovery, memory checks, and PyTorch device allocation.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger("truthlens.device")


def get_device_info() -> Dict[str, Any]:
    """Inspects and returns system compute hardware capabilities."""
    info: Dict[str, Any] = {
        "cuda_available": False,
        "device_count": 0,
        "device_name": None,
        "cuda_version": None,
        "allocated_device": "cpu",
        "total_memory_mb": 0,
    }

    try:
        import torch

        if torch.cuda.is_available():
            info["cuda_available"] = True
            info["device_count"] = torch.cuda.device_count()
            info["device_name"] = torch.cuda.get_device_name(0)
            info["cuda_version"] = torch.version.cuda
            info["allocated_device"] = "cuda:0"
            props = torch.cuda.get_device_properties(0)
            info["total_memory_mb"] = round(props.total_memory / (1024**2), 2)
            logger.info(
                f"GPU Accelerated: {info['device_name']} ({info['total_memory_mb']} MB VRAM), CUDA {info['cuda_version']}"
            )
        else:
            logger.warning("CUDA not available in PyTorch build. Falling back to CPU.")
    except ImportError:
        logger.warning("PyTorch not installed yet. Running on host environment.")

    return info


def get_torch_device(override: str = "auto"):
    """Returns torch.device object based on configuration and hardware availability."""
    import torch

    if override == "cpu":
        return torch.device("cpu")
    if override == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA explicitly requested but torch.cuda.is_available() is False.")
        return torch.device("cuda:0")

    return torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
