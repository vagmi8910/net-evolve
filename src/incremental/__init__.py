"""
__init__.py for incremental learning module.
"""
from incremental.continual_learner import IncrementalLearner, ExemplarBuffer, expand_classifier_head

__all__ = ["IncrementalLearner", "ExemplarBuffer", "expand_classifier_head"]
