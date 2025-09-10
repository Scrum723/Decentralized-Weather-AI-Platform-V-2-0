# Simple numpy replacement for basic operations
import random
import math

class MockNumpy:
    """Mock numpy module for basic operations without compilation requirements"""
    
    def __init__(self):
        self.random = self
    
    def normal(self, loc=0.0, scale=1.0, size=None):
        """Generate random normal values"""
        if size is None:
            return random.gauss(loc, scale)
        else:
            return [random.gauss(loc, scale) for _ in range(size)]
    
    def uniform(self, low=0.0, high=1.0, size=None):
        """Generate random uniform values"""
        if size is None:
            return random.uniform(low, high)
        else:
            return [random.uniform(low, high) for _ in range(size)]
    
    def choice(self, a, size=None):
        """Random choice from array"""
        if size is None:
            return random.choice(a)
        else:
            return [random.choice(a) for _ in range(size)]

# Create the mock
np = MockNumpy()

# Common functions
def sin(x):
    return math.sin(x)

def cos(x):
    return math.cos(x)

def sqrt(x):
    return math.sqrt(x)

def exp(x):
    return math.exp(x)

def log(x):
    return math.log(x)

def max(a):
    return max(a) if hasattr(a, '__iter__') else a

def min(a):
    return min(a) if hasattr(a, '__iter__') else a

def mean(a):
    return sum(a) / len(a) if hasattr(a, '__iter__') and len(a) > 0 else a

def std(a):
    if not hasattr(a, '__iter__'):
        return 0
    m = mean(a)
    return math.sqrt(sum((x - m) ** 2 for x in a) / len(a)) if len(a) > 0 else 0