<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    Mage
 * @package     Mage_Page
 * @copyright   Copyright (c) 2010 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/**
 * YooChoose JS-Tracking Html page block
 *
 * @category   YooChoose
 * @package    YooChoose_JsTracking
 * @author     YooChoose, yoochoose.net
 */
class YooChoose_JsTracking_Block_Html_Head extends Mage_Page_Block_Html_Head
{
    /**
     * Classify HTML head item and queue it into "lines" array
     *
     * @see self::getCssJsHtml()
     *
     * @param array  &$lines
     * @param string $itemIf
     * @param string $itemType
     * @param string $itemParams
     * @param string $itemName
     * @param array  $itemThe
     */
    protected function _separateOtherHtmlHeadElements(&$lines, $itemIf, $itemType, $itemParams, $itemName, $itemThe)
    {
        $params = $itemParams ? ' ' . $itemParams : '';
        $href = $itemName;
        switch ($itemType) {
            case 'external_js':
                $lines[$itemIf]['other'][] = sprintf('<script type="text/javascript" src="%s" %s></script>', $href, $params);
                break;

            case 'external_css':
                $lines[$itemIf]['other'][] = sprintf('<link rel="stylesheet" type="text/css" href="%s" %s/>', $href, $params);
                break;

            default:
                parent::_separateOtherHtmlHeadElements($lines, $itemIf, $itemType, $itemParams, $itemName, $itemThe);
                break;
        }
    }
}
