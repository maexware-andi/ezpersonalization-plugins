<?php

class Yoochoose_JsTracking_Model_Observer 
{
    const YOOCHOOSE_LICENSE_URL = 'https://admin.yoochoose.net/api/v4/';

    protected $orderIds;

    /**
     * Applies the special price percentage discount
     * @param   Varien_Event_Observer $observer
     * @return  Yoochoose_JsTracking_Observer
     */
    public function trackBuy($observer)
    {
        $orderIds = $observer->getEvent()->getOrderIds();
        if (empty($orderIds) || !is_array($orderIds)) {
            return;
        }

        $block = Mage::app()->getFrontController()->getAction()->getLayout()->getBlock('yoochoose.jstracking');
        if ($block) {
            $block->setOrderId(end($orderIds));
        }
    }

    /**
     *
     * @param Varien_Event_Observer $observer
     */
    public function adminSystemConfigChangedSectionYoochoose($observer)
    {
        $postData = $observer->getEvent()->getData();
        $configScope = null;

        if (is_null($postData['store']) && $postData['website']) {
            $scopeId = Mage::getModel('core/website')->load($postData['website'])->getId();
            $configScope = Mage::app()->getWebsite($scopeId);
            $scopeName = 'websites';
        } else if ($postData['store']) {
            $scopeId = Mage::getModel('core/store')->load($postData['store'])->getId();
            $configScope = Mage::app()->getStore($scopeId);
            $scopeName = 'stores';
        } else {
            $scopeId = 0;
            $scopeName = 'default';
        }

        if (is_null($configScope)) {
            $customerId = Mage::getStoreConfig('yoochoose/general/customer_id');
            $licenseKey = Mage::getStoreConfig('yoochoose/general/license_key');
        }  else {
            $customerId = $configScope->getConfig('yoochoose/general/customer_id');
            $licenseKey = $configScope->getConfig('yoochoose/general/license_key');
        }

        if (!$customerId && !$licenseKey) {
            return;
        }

        try {
            $body = array(
                'base' => array(
                    'type' => 'MAGENTO',
                    'pluginId' => Mage::getStoreConfig('yoochoose/general/plugin_id'),
                    'endpoint' => Mage::getStoreConfig('yoochoose/general/endpoint'),
                    'appKey' => '',
                    'appSecret' => md5($licenseKey),
                ),
                'frontend' => array(
                    'design' => Mage::getStoreConfig('yoochoose/general/design'),
                )
            );

            $url = self::YOOCHOOSE_LICENSE_URL . $customerId . '/plugin/';
            $url .= (Mage::getStoreConfig('yoochoose/general/endpoint_overwrite') ? 'update?createIfNeeded' : 'create?recheckType') . '=true&fallbackDesign=true';
            Mage::getModel('core/config')->saveConfig('yoochoose/general/endpoint_overwrite', 0, $scopeName, $scopeId);

            Mage::helper('yoochoose_jstracking')->_getHttpPage($url, $body, $customerId, $licenseKey);
            Mage::getSingleton('adminhtml/session')->addSuccess('Plugin registrated successfully');

        } catch (Exception $ex) {
            Mage::throwException('Plugin registration failed: ' . $ex->getMessage());
        }

    }

    /**
     * Adds additional filters to search results
     *
     * @param Varien_Event_Observer $observer
     */
    public function filterParameters(Varien_Event_Observer $observer)
    {
        $manufacturerName = Mage::app()->getRequest()->getParam('manufacturer');
        $block = Mage::app()->getLayout()->getBlock('search_result_list');
        if ($block && $manufacturerName) {
            $productModel = Mage::getModel('catalog/product');
            $attr = $productModel->getResource()->getAttribute('manufacturer');
            if ($attr->usesSource()) {
                 $manufacturerId = $attr->getSource()->getOptionId($manufacturerName);
            }

            $collection = $block->getLoadedProductCollection();
            $collection->addAttributeToFilter('manufacturer', $manufacturerId);
        }
    }
}