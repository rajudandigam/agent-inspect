from checks.support_level_network import check_support_and_network
from checks.standards_version_known_loss import check_tested_version_known_loss

def test_offline_vs_egress():
    probs = check_support_and_network({"support_level": "offline", "network_behavior": "required"})
    assert probs

def test_ok_offline():
    assert check_support_and_network({"support_level": "offline", "network_behavior": "none"}) == []

def test_known_loss_requires_version():
    assert check_tested_version_known_loss({"known_loss": ["x"]})
    assert check_tested_version_known_loss({"tested_version": "1.0", "known_loss": ["x"]}) == []
